/**
 * Trivia rounds — the only file you need to edit to add questions.
 *
 * The engine (scoring, rooms, screens) reads `TRIVIA_ROUNDS`. It does not
 * care about categories beyond what you put in this list. Delete the
 * placeholder round once a real one exists, or leave it; the lobby badges
 * it and will stop pre-selecting it as soon as any non-placeholder round
 * is in the list.
 *
 * Full write-up: README section “Add a trivia round”.
 *
 * Question kinds:
 * - choice:  one correct index into `choices`
 * - boolean: true / false
 * - number:  closest number to `answer` (exact scores like a right choice)
 */

export type ChoiceQuestion = {
  id: string
  kind: 'choice'
  prompt: string
  /** Two to six short labels. `answer` is the index of the right one. */
  choices: string[]
  answer: number
  /** Shown to everyone after the question, optional. */
  note?: string
}

export type BooleanQuestion = {
  id: string
  kind: 'boolean'
  prompt: string
  answer: boolean
  note?: string
}

export type NumberQuestion = {
  id: string
  kind: 'number'
  prompt: string
  answer: number
  /** Appended when the answer is shown, e.g. "miles" or "sides". */
  unit?: string
  note?: string
}

export type TriviaQuestion = ChoiceQuestion | BooleanQuestion | NumberQuestion

export type TriviaRound = {
  /** Stable id: lowercase letters, numbers, hyphens. Used in the room document. */
  id: string
  title: string
  blurb: string
  /**
   * Mark sample data that is not real content. The lobby shows a badge and
   * will not pre-select these once a real round exists.
   */
  placeholder?: boolean
  questions: TriviaQuestion[]
}

export const TRIVIA_ROUNDS: TriviaRound[] = [
  {
    id: 'placeholder',
    title: 'Placeholder round',
    blurb: 'Obvious dummy questions so the room flow can be tested. Not a real round.',
    placeholder: true,
    questions: [
      {
        id: 'sky',
        kind: 'choice',
        prompt: 'Placeholder: which word is a color of a clear daytime sky?',
        choices: ['Blue', 'Toast', 'Seven'],
        answer: 0,
        note: 'Dummy multiple choice. The sample answer is Blue.',
      },
      {
        id: 'sum',
        kind: 'boolean',
        prompt: 'Placeholder: two plus two equals four.',
        answer: true,
        note: 'Dummy true/false. The sample answer is true.',
      },
      {
        id: 'sides',
        kind: 'number',
        prompt: 'Placeholder: how many sides does a triangle have?',
        answer: 3,
        unit: 'sides',
        note: 'Dummy closest-number. The sample answer is 3.',
      },
    ],
  },
]

export function findRound(rounds: readonly TriviaRound[], id: string | null | undefined) {
  if (!id) return undefined
  return rounds.find((round) => round.id === id)
}

export function roundById(id: string | null | undefined) {
  return findRound(TRIVIA_ROUNDS, id)
}

const ROUND_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const QUESTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateRounds(rounds: readonly TriviaRound[]): string[] {
  const problems: string[] = []
  const seenRounds = new Set<string>()
  for (const round of rounds) {
    if (!ROUND_ID.test(round.id)) problems.push(`Round id “${round.id}” should be kebab-case.`)
    if (seenRounds.has(round.id)) problems.push(`Duplicate round id “${round.id}”.`)
    seenRounds.add(round.id)
    if (!round.title.trim()) problems.push(`Round “${round.id}” needs a title.`)
    if (round.questions.length === 0) problems.push(`Round “${round.id}” has no questions.`)
    const seenQuestions = new Set<string>()
    for (const question of round.questions) {
      const label = `${round.id}/${question.id || '(missing id)'}`
      if (!QUESTION_ID.test(question.id)) problems.push(`${label}: question id should be kebab-case.`)
      if (seenQuestions.has(question.id)) problems.push(`${label}: duplicate question id.`)
      seenQuestions.add(question.id)
      if (!question.prompt.trim()) problems.push(`${label}: prompt is empty.`)
      if (question.kind === 'choice') {
        if (question.choices.length < 2 || question.choices.length > 6) {
          problems.push(`${label}: choice questions need 2–6 choices.`)
        }
        if (question.choices.some((choice) => !choice.trim())) {
          problems.push(`${label}: a choice is empty.`)
        }
        if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) {
          problems.push(`${label}: answer index is outside the choices.`)
        }
      } else if (question.kind === 'boolean') {
        if (typeof question.answer !== 'boolean') problems.push(`${label}: answer must be true or false.`)
      } else if (question.kind === 'number') {
        if (typeof question.answer !== 'number' || !Number.isFinite(question.answer)) {
          problems.push(`${label}: answer must be a finite number.`)
        }
      } else {
        problems.push(`${label}: unknown question kind.`)
      }
    }
  }
  return problems
}
