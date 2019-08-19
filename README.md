# BibTeX-TS

BibTeX parser written in TypeScript in rigorous but dumb way.

This project is motivated by personal needs. Goal is to support well-structured (debatable!) BibTeX parsing and rendering. Speed and organizedness are prioritized. Code should always be written by following some documentation (though different versions of documentation contradict each other) instead of translating other implementations.

It would be amazing if you find it useful.

## To-Dos

- [ ] Add tests.
- [ ] Implement `abbrv`, `acm`, `apalike`, `plain` and `siam`. Note that `ieeetr` and `unsrt` are not implementable unless we introduce body-dependent sorting.
