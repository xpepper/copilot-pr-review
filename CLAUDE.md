# Claude Code instructions

[AGENTS.md](AGENTS.md) is the authoritative agent workflow for this repository.
Read it first, then [SCOPE.md](SCOPE.md), [ROADMAP.md](ROADMAP.md) and
[HANDOFF.md](HANDOFF.md), and follow them exactly.

The rule that catches agents out most often: **every increment lands on a branch
and a pull request, never on `main`, and that pull request is reviewed with this
plugin before a merge is requested.** A repository ruleset enforces it, with no
bypass for admins. The review spends Copilot credits; the standing workflow
authorizes one review per increment pull request and nothing else, and findings
stay local unless the user asks for them to be posted.
