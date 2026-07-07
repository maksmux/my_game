# Retrospective

## AI Tools Used

- OpenAI Codex desktop / GPT-5 coding agent.
- Local shell tooling for repository inspection and validation.

## Development Workflow

The workflow started from the challenge description rather than an existing codebase. The AI agent translated the rules into a short specification, selected a static browser architecture, implemented the game engine, built the UI, added tests, and drafted the required documentation.

The most useful pattern was separating the deterministic game logic from the animated browser layer. That allowed the AI to test the rules directly before relying on manual gameplay.

## What Worked Well

- A static HTML/CSS/JavaScript app matched the deployment goal better than a heavier framework.
- The game rules were compact enough to model as small engine functions.
- Step-based engine functions made animation easier because the UI could resolve one card placement at a time.
- Writing tests forced clarification of edge cases, especially immediate discard and final-position win behavior.

## What Did Not Work Well

- The original rules did not explicitly say what happens when the first drawn card points to an already revealed position. The implementation treats it the same as any later picked-up card: discard and end the turn.
- The exact GitLab Pages domain can depend on the GitLab instance configuration, so the README link may need one final update after the first pipeline publishes Pages.
- Browser secrecy is limited in local multiplayer because all players share one screen. Since there are no decisions, this does not change gameplay, but a production version would need pass-and-play masking or separate devices.

## Surprises and Discoveries

- The game has almost no strategy, but the replacement chain still creates suspense because one draw can trigger a long reveal sequence.
- The win condition is easiest to reason about if it fires immediately after the final hidden position is revealed, before continuing with the picked-up card.
- Buildless deployment is a strong fit for small challenge projects because it removes CI/CD dependency installation risk.

## Estimated Percentage of AI-Generated Code

Approximately 85-90% of the initial implementation was AI-generated from human-provided requirements, with the human expected to review, run, and adjust final presentation details.

## Time Spent

Estimated initial build time: 1.5-2.5 hours including requirements interpretation, implementation, tests, documentation, and validation.

## What I Would Do Differently Next Time

- Ask earlier whether "Java" means JavaScript in the browser or JVM-based Java.
- Capture a final screenshot and add it to the README after the hosted page is available.
- Add a small deterministic replay mode to make demos easier.
- Add pass-and-play privacy controls if local multiplayer secrecy becomes important.

## Key Lessons Learned

- AI-native development works best when the agent first converts ambiguous requirements into testable rules.
- A small rule engine with focused tests gives fast feedback and keeps UI animation work safer.
- Deployment should be considered during architecture selection, not bolted on after implementation.
- Retrospective notes are more useful when they include friction and unresolved assumptions, not only successful steps.
