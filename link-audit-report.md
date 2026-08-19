# A2Z Learning Solutions — Link & Navigation Audit

## Planned cleanup
- Fix broken relative paths in deep Grade 6 pages.
- Audit HTML href/src references.
- Standardize global navigation.
- Make intended cards actionable or label unfinished resources Coming Soon.
- Add Grade 6 → Science → Chapter breadcrumbs.
- Consolidate legacy navigation.
- Apply the site hover-polish stylesheet consistently.
- Run a final 404 crawl before deployment.

## Verified issues
- Grade 6 Chapter 1 pages use `../../../..` for the repository home; from `/class-6/science/chapter-1/` the repository root is `../../..`.
- `classes.html` exposes chapter entries that are not all links.
- `recent-updates.html` and `neet-jee.html` use reduced navigation compared with the homepage.
- Class 11 and Class 12 subject cards are currently non-actionable.
- Chapter 1 pages need consistent global navigation and breadcrumbs.

## Status
This branch is the working branch for the navigation/link cleanup. Final 404 validation should be performed against the complete edited tree before merging to `main`.
