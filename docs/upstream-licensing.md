# Upstream licensing and attribution

`SCOPE.md` records one open instruction about the project this port derives
from: *"The package declares MIT licensing, but a standalone license text was
not found during research. Confirm applicable licensing and attribution
obligations before reusing or redistributing source."* This file is increment
`L1`'s answer to it.

It answers the question for the inspected revision, records the evidence so the
answer can be rechecked rather than believed, and states the working rule this
project follows. It is a record of what the primary sources say. It is not legal
advice, and the one decision it deliberately does not take is whether this
project should carry a licence of its own.

## The answer in one paragraph

**The upstream project declares MIT, and publishes no licence text and no
copyright notice.** Both halves are established from primary sources, and both
matter. The declaration is unambiguous and appears in every place upstream
publishes metadata, so the intended terms are not in doubt. What does not exist
anywhere upstream is the artifact that MIT's single condition tells a
redistributor to carry forward: there is no `LICENSE` file, no licence section,
and no copyright line in any distributed file. A redistributor therefore cannot
discharge that condition by reproducing what upstream published, because
upstream published neither the notice nor the permission text. **This project
has copied no upstream source, so no obligation is triggered, and the rule stays
that none should be copied.**

## What was inspected

`SCOPE.md` pins the baseline at `pi-pr-review` 1.17.10, commit
`457e18e30437984e2e6680802c9da25d270b82cc`. That commit is real and is the
release commit for that version, authored 2026-09-04, with the message
`release(main): release 1.17.10 (#143)`. Everything below is measured at that
revision unless it says otherwise.

The repository owner is the GitHub user account `10ego`, a personal account
rather than an organisation, whose profile display name is Ted Kim. The npm
package is published by the same account. The `pi.dev` listing sits under the
Pi project's site, whose footer credits Earendil Inc., but that is the site's
own footer and not a statement about who holds copyright in this package.

## The evidence

| Source | What it says |
| --- | --- |
| `package.json` at the inspected commit | `"license": "MIT"` |
| `package.json` inside the published tarball | `"license": "MIT"` |
| npm registry metadata for `pi-pr-review@1.17.10` | `"license": "MIT"`, maintainer `10ego`, provenance attestation present |
| `pi.dev` package listing | "MIT License", with no full text and no copyright line |
| Every file in the repository tree at that commit | no licence file: 356 entries, untruncated, zero paths matching licence, copying, notice, copyright, legal or third-party |
| `README.md` at that commit | 37687 bytes, 17 headings, zero word-boundary matches for licence, license, copyright or MIT |
| The 25 files in the published tarball | zero copyright or SPDX headers, and no licence text of any kind |
| GitHub's own licence detection | repository metadata `"license": null`, and the `/license` endpoint returns HTTP 404 |
| The upstream default branch on 2026-09-10 | still no licence file, at v1.18.1, with the repository actively pushed to that day |
| Upstream issues and pull requests | zero mention licence or license |

The declaration is consistent across four independent sources. The absence is
equally consistent across every place a licence text would live.

The tarball was verified as the genuine published artifact before being read:
its SHA-1 is `88db35cc407c33158d2c33a512f53d6fc6caf5ec`, which matches the
`dist.shasum` npm records for that version.

## What MIT obliges, and why a missing notice is not a formality

The MIT licence grants broad permission to use, copy, modify, merge, publish,
distribute, sublicense and sell, subject to one condition:

> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.

That condition refers to two artifacts, and neither exists upstream. There is no
copyright notice to include, and no permission notice to include. A redistributor
who wanted to comply exactly would have to write both, which means asserting a
copyright line on the holder's behalf that the holder never wrote, choosing a
year and a name for them.

Two readings of that situation are both defensible, and this project does not
need to pick one:

- **The pragmatic reading.** An SPDX identifier in a published manifest is a
  deliberate, public statement by the copyright holder about the terms they
  offer, and npm treats that field as how a package declares its licence. On
  this reading the grant is effective and the missing text is untidiness.
- **The conservative reading.** Copyright subsists by default and permission is
  the exception, so a grant should be evidenced by the licence it names. On this
  reading a bare identifier with no text leaves a redistributor unable to show
  what terms they accepted or to satisfy the notice condition.

**The gap between them only matters if this project reuses upstream source.** It
does not, so the cost of the ambiguity is currently zero, and the cheapest way to
remove it entirely is not a judgment call at all: ask upstream to add a `LICENSE`
file, or ask for written confirmation naming the holder and year. Either would
settle the question outright. Neither is required unless reuse is wanted.

## What may and may not be reused

**May be reused, and already is.** Observed behaviour, and the interface and
workflow decisions recorded in `SCOPE.md`. `SCOPE.md` already frames the port
this way: preserving upstream behaviour is "behavioural guidance, not a
requirement to copy pi-specific implementation details". What a program does is
not the expression that copyright protects, and an independently written
implementation of the same described behaviour carries no obligation from
upstream's licence.

**Must not be reused while this stands.** Any file, or substantial part of one,
from the upstream repository or its published package. That specifically
includes `prompts/pr-review.md`, which is 40027 bytes of prompt text and is the
single most tempting thing in the package to lift, along with everything under
`lib/` and `extensions/`, and the README's prose. Copying any of it would trigger
the notice condition described above, which cannot presently be discharged from
upstream material.

**If reuse is ever wanted**, the sequence is: settle the notice question with
upstream first, then copy, then carry the notice they provide. Not the reverse.

## Nothing has been reused, and that is measured

The claim that no upstream source has been copied is checked rather than
asserted. Every non-trivial line of the published upstream package was indexed
and compared against this project's shipped source:

- 5544 upstream lines indexed, being every line of at least 40 characters after
  whitespace normalisation, from all 25 distributed files
- 56 local files scanned, being everything under `extensions/` and `scripts/`
- **7 distinct shared strings**, the longest 53 characters

Every one of the seven is unoriginal boilerplate that any Node.js program of
this shape contains:

```
import { createHash } from "node:crypto";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
return Buffer.from(bytes).toString("utf8");
signal?.removeEventListener("abort", onAbort);
```

There is no shared prose, no shared prompt text, no shared identifier set and no
shared structure. The two implementations do not even share a language: upstream
is TypeScript for the Pi agent, and this port is `.mjs` for the Copilot CLI.

## The attribution this project carries

No attribution is *owed*, because the notice condition attaches to copies and
substantial portions, and there are none. Credit is nonetheless accurate and
cheap, so this project states it:

> This plugin is an independent reimplementation for the GitHub Copilot CLI of
> the review workflow of [`pi-pr-review`](https://github.com/10ego/pi-pr-review)
> by the GitHub user `10ego`, studied at version 1.17.10, commit
> `457e18e30437984e2e6680802c9da25d270b82cc`. That project declares the MIT
> licence and publishes no licence text or copyright notice. No upstream source
> code, prompt text or documentation has been copied into this project.

That paragraph is the text that discharges the credit. It is recorded here and
pointed at from `SCOPE.md`. It is deliberately not placed in a root-level
`NOTICE` file, for two reasons: a root markdown file enters this project's own
safeguard-discovery candidate set, where it would be noise, and a `NOTICE` file
conventionally signals a licence obligation being discharged, which would
overstate what is happening here.

## The open question `L1` left, and the answer `D1` recorded

**Whether this project should carry a licence of its own is the user's decision,
and `L1` deliberately left it open.** The repository was public and had no
`LICENSE` file, which put it in the same position it had just finished
documenting upstream being in: default copyright, no grant, so nobody could
reuse it. That may be exactly what is wanted for a personal tool, but it is a
decision worth taking deliberately rather than by default.

**It was taken during `D1`. This project is MIT licensed**, and the text is in
[`LICENSE`](../LICENSE) at the root, carrying `Copyright (c) 2026 Pietro Di
Bello`. The text is the canonical MIT template, so nothing was copied from
upstream to produce it, and this project now does the one thing this document
records upstream not doing: it publishes both the permission notice and a
copyright line, so anyone reusing it can discharge the condition from what is
published here.

**This changes nothing above.** Upstream's declaration and its missing notice
are facts about upstream, unaffected by what this project licenses itself under,
and matching licences do not create permission to copy. The rule in
["What may and may not be reused"](#what-may-and-may-not-be-reused) stands
exactly as written: behaviour and interfaces yes, source no.

## Reproducing this

Every figure above comes from these commands. None needs a model or a paid API.
The upstream checks need only `gh`, `curl` and `tar`. The reuse audit at the end
is the one step that also needs this checkout, because it is the one figure
about this repository rather than about upstream.

```sh
SHA=457e18e30437984e2e6680802c9da25d270b82cc

# the declared licence, at the exact revision. Raw content, so no base64 decode
# is involved and no GNU-only flag is needed.
gh api "repos/10ego/pi-pr-review/contents/package.json?ref=$SHA" \
  -H "Accept: application/vnd.github.raw" | grep '"license"'

# no licence file anywhere in that tree
gh api "repos/10ego/pi-pr-review/git/trees/$SHA?recursive=1" \
  --jq '{truncated, count: (.tree | length)}'
gh api "repos/10ego/pi-pr-review/git/trees/$SHA?recursive=1" --jq '.tree[].path' \
  | grep -iE 'licen[cs]e|copying|notice|copyright|legal|third.?party'

# no licence section in the README at that revision
gh api "repos/10ego/pi-pr-review/contents/README.md?ref=$SHA" \
  -H "Accept: application/vnd.github.raw" \
  | grep -nowiE 'licence|license|copyright|MIT'

# GitHub's own detection finds none, and none has appeared on the default branch
gh api repos/10ego/pi-pr-review --jq '{license, pushed_at, default_branch}'
gh api repos/10ego/pi-pr-review/license
gh api repos/10ego/pi-pr-review/contents --jq '.[].name' \
  | grep -iE 'licen[cs]e|copying|notice'
gh api repos/10ego/pi-pr-review/releases/latest --jq '.tag_name'

# nobody upstream has raised it
gh api "search/issues?q=repo:10ego/pi-pr-review+license+OR+licence+OR+LICENSE" \
  --jq '.total_count'

# what npm records for the published version
curl -sS https://registry.npmjs.org/pi-pr-review/1.17.10 | python3 -c \
  'import json,sys; d=json.load(sys.stdin); print(d["license"], [m["name"] for m in d["maintainers"]], d["dist"]["shasum"])'

# the published artifact: verified first, and listed and extracted only if the
# digest matches, so a substituted download stops here instead of being read
curl -sSo pkg.tgz https://registry.npmjs.org/pi-pr-review/-/pi-pr-review-1.17.10.tgz
echo '88db35cc407c33158d2c33a512f53d6fc6caf5ec  pkg.tgz' | shasum -a 1 -c - \
  && tar -tzf pkg.tgz | grep -iE 'licen[cs]e|copying|notice' \
  ; tar -xzf pkg.tgz && grep -rniE 'copyright|SPDX' package/
```

Every `grep` above is expected to match nothing and exit 1, except the first,
which prints the declared licence. The `pi.dev` listing is a web page rather
than an API, so it is the one source read in a browser.

**The reuse audit.** This is the figure that needs this checkout. Run it from
the directory holding the extracted `package/`, passing that directory and the
path to this repository:

```sh
node --input-type=module -e '
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const [pkg, checkout] = process.argv.slice(1);
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const norm = (s) => s.replace(/\s+/g, " ").trim();
const keep = (s) => norm(s).length >= 40 && /[a-zA-Z]/.test(s);
const upstream = new Set();
for (const f of walk(pkg).filter((p) => /\.(ts|mjs|js|md|json)$/.test(p)))
  for (const l of readFileSync(f, "utf8").split("\n")) if (keep(l)) upstream.add(norm(l));
const local = ["extensions", "scripts"]
  .flatMap((d) => walk(join(checkout, d)))
  .filter((p) => /\.(mjs|js|ts|txt)$/.test(p));
const shared = new Set();
for (const f of local)
  for (const l of readFileSync(f, "utf8").split("\n")) if (keep(l) && upstream.has(norm(l))) shared.add(norm(l));
console.log(`upstream lines ${upstream.size}, local files ${local.length}, shared ${shared.size}`);
for (const s of [...shared].sort()) console.log(`  ${s}`);
' "$PWD/package" /path/to/this/checkout
```

It prints `upstream lines 5544, local files 56, shared 7` followed by the seven
boilerplate strings listed earlier, and nothing else. Rerun it if upstream
source is ever considered again. A shared string that is not one of those seven,
or one that is not obviously boilerplate, is the signal that this document's
central conclusion no longer holds.
