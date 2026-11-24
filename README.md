# The World Today — 24 November 2026

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/maxinung/makefun-news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/maxinung/makefun-news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

A single dense newspaper page that sums up Tuesday 24 November 2026 in
one image: 31 stories from 7 regions — climate, the Middle East, Europe,
technology, Asia-Pacific, Africa, and the Americas — set in two columns
under one masthead. Every story was checked against a report published
on 24 November 2026.

## Run

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png`, a 1024x1024 PNG under 1 MiB. The renderer is
fully deterministic: it uses only the Node standard library and a small
bitmap font atlas baked into `main.ts`, so it needs no network, no clock,
and no randomness, and two runs produce byte-identical output.

## License

MIT — see `LICENSE`.
