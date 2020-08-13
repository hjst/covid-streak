# COVID-19 streak (work in progress)

<blockquote><p><b>6. b.</b> A temporary run (of luck). In phrase: <b><i>(on) a losing (or winning) streak</i></b>, (experiencing) a series of losses (or wins). Hence, a series (of games, etc.) of a specified kind.</p><footer>— <cite>Oxford English Dictionary, 2nd Edition</cite></footer></blockquote>

## What?

Web page that fetches the latest UK data on new COVID-19 cases per day for an area, and displays how many days it has been since the last confirmed case.

<img src="screenshot.png" width="299" alt="Screenshot showing the stats view for Herefordshire">

## Why?

I was wondering how many new cases were being diagnosed in my city per day, and if was declining.
Were we maybe on a "winning streak" of no new cases?
I found the [GOV.uk COVID-19 data API](https://coronavirus.data.gov.uk), but couldn't find a historical breakdown of the data I wanted at a local level, or the sort of visualisation I had in mind.
Thankfully, with the API, it wasn't hard to build.

## How?

You select an Upper-Tier Local Authority area within the UK, and the page fetches data on new cases (by specimen date, rather than reported date) for the last 1000 days for that area.
Any day with 0 new cases is considered to be part of a "winning streak".

For implementation details see [the source of the stats.html page](https://github.com/hjst/covid-streak/blob/plague/stats.html).

## This is deeply flawed / you can't rely on this data

Yes. Knowing this, you may still find it useful.