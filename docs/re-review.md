# Re-reviewing a pull request

When this tool reviews a pull request it has reviewed before, it can say what
the earlier review evaluated, confine its fresh hunting to the commits added
since, judge what became of the findings that review published, and answer the
threads it left. This guide covers all four. [README.md](../README.md) is the
user guide and summarises them.

Everything here except the first section is opt-in. A review with no flag reads
the earlier review, reports the verdicts it can prove for free, and hunts the
whole pull request exactly as a first review does.

## What an earlier review of the same pull request evaluated

Capture ends by reporting whether this tool has already reviewed this pull
request, and how the head you are about to review relates to the head that
earlier review saw. It reads GitHub only, spends no credits, and `--capture-only`
reports it too.

A review counts only when your authenticated GitHub identity submitted it **and**
it carries the review body this tool builds: one of four mode labels, a count of
selected validated findings, a stated coverage, and the closing claim sentence.
An ordinary hand-written review matches none of that and is counted as
considered rather than treated as a prior one. A body deliberately written to
imitate all four parts would still be taken for ours.

| Reported | Meaning |
| --- | --- |
| `none` | No earlier review of ours. The line says how many submitted reviews were considered |
| `same-head` | The reviewed head is exactly the head that review evaluated |
| `incremental` | Commits were added after it, and the reviewed head still descends from it |
| `diverged` | The reviewed head does not descend from it, including a head rewound behind it |
| `unknown` | GitHub could no longer reach that head, so the relationship was not measured |

Each inline comment of that review is retained with its body exactly as posted
and its anchor normalised to a fixed shape: path, side, the current line, and the
line it was written at, which GitHub keeps after an anchor falls out of the
current diff. Every other field GitHub returns is dropped.

Two things act on this. **Revalidating that review's findings happens in every
review**, for the verdicts that cost nothing, and is the section after next;
`--revalidate` buys the rest. **Confining fresh hunting happens only when you ask
for it**, with `--incremental`, in the section below. Discovery failure is
reported as itself and never refuses a review.

## Confining a re-review to the new commits

Pass `--incremental` to confine fresh hunting to the commits added since the
earlier review, so a re-review stops reporting hunks that review already
covered:

```text
/pr-review 123 --deep --no-comment --incremental
```

It is a request rather than a parse-time contract, and it is the only flag that
is: whether a forward commit range exists at all is a fact about the pull
request, and nothing knows it until capture has run. When capture reports the
relationship as `incremental`, those commits are read and their head-side line
ranges become the confined scope. On any other relationship, on a pull request
this tool has never reviewed, when the range cannot be read, or when those
commits change no file, the run narrows nothing and says which of those it was.

**Confinement is a filter over the captured binding, never a replacement for
it.** The captured base-to-head diff, the context windows, the provenance checks
and every citation rule reach the reviewers exactly as they do in any other run,
and a finding still has to anchor inside a hunk of that captured diff, because
publication would refuse anything else. What the flag changes is only what may
be reported: the reviewers are given the confined head-side line ranges and
every path those commits touched on either side, and are asked to anchor there,
and code sets aside any candidate anchored outside them, before adjudication, so
a candidate an earlier turn covered is not paid to be judged again.

A candidate set aside is **reported with its location rather than dropped**, and
is never adjudicated, so it is neither a validated finding nor a refuted one:

```text
1 candidate(s) set aside as already covered by the earlier review: each anchors outside the
commit range this run confined fresh hunting to, and none of them was adjudicated, so none is
a validated finding and none is refuted:
correctness:2: [P2] Free shipping now applies to small orders at shipping.js:3-3 (head)
```

One thing the range cannot settle is a base-side anchor, which names the
captured base revision that comparison never saw. A base-side candidate in a
file those commits did touch therefore stays in scope, and the reviewers are
told which paths those are, because **a file the new commits deleted has no
head-side line at all** and a base-side anchor is the only one such a defect can
have. The filter removes only what it can prove an earlier turn already
covered.

**A confined review does not cover the whole pull request**, and says so in the
run and in the published review body. It says it as an informational caveat
rather than as incomplete coverage, because nothing failed and `INCOMPLETE` has
to keep meaning that something did. What the run did not hunt was covered by the
earlier review, whose own coverage this run does not read and does not vouch
for.

That is why the flag is opt-in and narrowing is not the default. Two cases
decided it. A re-review in a heavier mode than the earlier one would otherwise
silently never reach the hunks that lighter mode only skimmed. And the earlier
review's own coverage cannot be read: the body signature requires a coverage
sentence and deliberately never reads what it says, because that prose is the
part most likely to change between versions of this tool.

## Revalidating the earlier review's findings

Every review that finds an earlier review of the same pull request reports what
became of the findings that review published. It reads the comments discovery
already retained, spends nothing, and settles only what it can prove:

| Verdict | Proved by |
| --- | --- |
| still open | The commits added since that review do not touch the lines the comment anchors on |
| still open | The reviewed head is exactly the head that review evaluated, so nothing has changed |
| obsolete | GitHub can no longer place the comment in the current diff |
| obsolete | Those commits deleted the file the comment anchors in |
| not settled | Anything else, including a file those commits renamed |

The asymmetry is deliberate: code proves that a finding still stands and never
that it has gone away. **Nothing is ever proved resolved without reading the
code**, because absence of evidence that a defect remains is not evidence that
somebody fixed it, and a wrongly resolved finding is one nobody looks at again.

Pass `--revalidate` to buy one model pass over exactly what is left:

```text
/pr-review 123 --deep --no-comment --revalidate
```

That pass reads the checkout the revision gate has already proved is the
reviewed head, and returns resolved, still open or obsolete for each finding it
was asked about. It is never asked about a verdict the code proved and can never
overturn one. A verdict for a finding it was not asked about, a word that is not
one of the three, and silence about a finding are each ignored rather than
trusted, and a pass that fails settles nothing and loses nothing.

Like discovery and confinement, **revalidation grounds nothing a finding depends
on**, so a failed pass is reported as itself and never becomes the review's
coverage. It reports no new finding. A comment this tool cannot read back into a
finding is named and counted rather than guessed at.

## Answering the threads that review left

A settled verdict is posted as a reply on the thread the earlier review's
comment started:

```text
Revalidated at head 4f2c9b1...: STILL OPEN.

The commits added since that review do not touch the lines this comment anchors on.

Decided by this tool, from the commit range.

This is a revalidation of a finding an earlier review by this tool published. It is not a
re-review of this pull request.
```

Replies carry **the review's own posting authority and no other**. `--no-comment`
suppresses them exactly as it suppresses the review, `--comment` and
`autoPostReviews` authorize them, a confirmed review proposal covers them, and a
declined one refuses them and is never re-asked. What they do not need is a
review: a re-review that selects no finding and has three earlier findings to
answer is the case this exists for. **When there was no review proposal to
confirm, the replies ask for themselves**, because nothing else had the chance
to. An unsettled verdict is never posted, because replying that this tool could
not tell is noise.

A thread already carrying this run's answer **at this head** is skipped rather
than answered twice. A thread answered at an older head is answered again,
because that answer was about a different revision.

**This is the only write in this tool that is more than one request**, and the
one place where partial completion is an ordinary result rather than an error.
Each reply is journalled before it is sent. A reply GitHub definitely refuses
does not stop the others, because it is known not to have been written. **An
unknown outcome stops the set**: every thread after it is deliberately left
unattempted rather than becoming a second unknown, the run says so, and the
retained record says which thread it was. Do not retry it; inspect the pull
request and reconcile the record first.

`/pr-review publish` deliberately answers no thread. A verdict about the current
code was grounded in a read of the checkout at the reviewed head, and that
command never reads a checkout.
