export class AreaCovidHistory {
    constructor(apiResponse) {
        // this.rawDays = apiResponse.data.slice(2);
        this.rawDays = apiResponse.data;
        this.area = {
            name: apiResponse.data[0].areaName,
            code: apiResponse.data[0].areaCode,
            type: apiResponse.data[0].areaType,
            get friendlyName() {
                return this.name.replace(/, (City|County) of/g, '');
            }
        }
    }
    get days() {
        return [...this.missingDays, ...this.rawDays.map(day => {
            // semi-abuse destructuring assignment to discard raw fields we don't want
            const { areaName, areaCode, areaType, ...cleanDay } = day;
            return cleanDay;
        })];
    }
    get daysSinceLastConfirmedCase() {
        let last_known_case = this.days.find(day => day.newCases > 0);
        if (!last_known_case) {
            last_known_case = this.days[this.days.length - 1]; // earliest known day
        }
        // TODO: would it be simpler here to have days[n].date be a Date obj instead of a string?
        return AreaCovidHistory.daysDiff(new Date(last_known_case.date), new Date());
    }
    get missingDays() {
        const most_recent_day = this.rawDays[0].date;
        const num_missing_days = AreaCovidHistory.daysDiff(new Date(most_recent_day), new Date());
        const missing_days = [];
        for (let index = 1; index <= num_missing_days; index++) {
            const missing_date = new Date(most_recent_day);
            missing_date.setDate(missing_date.getDate() + index);
            missing_days.unshift({date: missing_date.toISOString().split('T')[0], newCases: null}); // TODO: switch to Date objs?
        }
        return missing_days;
    }
    get streaks() {
        // TODO: slim this down with Array.map()?
        const streaks = [];
        let num_streaks = 0;
        let streak_active = false;
        [...this.days].reverse().forEach((day) => {
            // reverse here so we can process in chronological order
            if (streak_active === false && day.newCases < 1) {
                // new streak! (include nulls in streaks)
                streak_active = true;
                streaks[num_streaks] = {
                    numDays: 1,
                    start: day.date
                };
            } else if (streak_active === true && day.newCases < 1) {
                // streak continues!
                streaks[num_streaks].numDays += 1;
            } else if (streak_active === true && day.newCases > 0) {
                // streak finishes!
                streaks[num_streaks].finish = day.date;
                streak_active = false;
                num_streaks += 1;
            } else {
                // non-streak days, do nothing
            }
        });
        return streaks;
    }
    get longestStreak() {
        return [...this.streaks].reduce(
            (prev, curr) => (prev.numDays > curr.numDays) ? prev : curr, {});
    }
    get csv() {
        return [...this.days].reverse().map(day => `${day.date},${(day.newCases) ? day.newCases : 0}`).join('\n');
    }
    static daysDiff(start, finish) {
        return Math.floor((finish - start) / 1000 / 60 / 60 / 24);
    }
}

export class StreakHTML {
    static calendarSeries(days) {
        const visual = document.createElement('p');
        days.forEach((day, index) => {
            const dayBlock = document.createElement('span');
            dayBlock.innerHTML = '<svg width="20px" height="20px" viewBox="1 1 20 20"><rect width="18px" height="18px" /></svg>';
            dayBlock.setAttribute('title', `${day.date}, confirmed cases: ${(day.newCases == null) ? 'no data' : day.newCases}`);
            dayBlock.className = StreakHTML.calculateBracket(day.newCases);
            if (index === 0) dayBlock.className += ' today';
            visual.append(dayBlock);
        });
        return visual;
    }
    static calculateBracket(datum) {
        // TODO: make this relative rather than absolute
        switch (datum) {
            case null:  return 'no-data';
            case 0:     return 'streak';
            default:
                if(datum < 10) return 'low';
                if(datum < 20) return 'mid';
                return 'high';
        }
    }
    static dateSpan(start, finish) {
        const startDay = start.getDate();
        const finishDay = finish.getDate();
        if (start.getMonth() === finish.getMonth()) {
            const month = new Intl.DateTimeFormat('default', {month: 'long'});
            return `${startDay}<sup>${StreakHTML.ordinalSuffix(startDay)}</sup> to `
                + `${finishDay}<sup>${StreakHTML.ordinalSuffix(finishDay)}</sup> ${month.format(start)}`;
        } else {
            const month = new Intl.DateTimeFormat('default', {month: 'short'});
            return `${startDay}<sup>${StreakHTML.ordinalSuffix(startDay)}</sup> ${month.format(start)} to `
                + `${finishDay}<sup>${StreakHTML.ordinalSuffix(finishDay)}</sup> ${month.format(finish)}`;
        }
    }
    static describeStreak(streak) {
        if (!!streak.start && !streak.finish) {
            return "this one!";
        } else if (!!streak.start && !!streak.finish) {
            return `${streak.numDays} ${(streak.numDays === 1) ? 'day ' : 'days '}`
                + `<span class="date-range">(${StreakHTML.dateSpan(new Date(streak.start), new Date(streak.finish))})</span>`;
        } else {
            return "none found 😢";
        }
    }
    static ordinalSuffix(dayNum) {
        // https://v8.dev/features/intl-pluralrules
        const pr = new Intl.PluralRules('default', {
            type: 'ordinal'
        });
        const suffixes = new Map([
            ['one', 'st'],
            ['two', 'nd'],
            ['few', 'rd'],
            ['other', 'th'],
        ]);
        return suffixes.get(pr.select(dayNum));
    }
}
