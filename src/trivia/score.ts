import type { TriviaQuestion } from './rounds'
import type { StoredAnswer } from './protocol'

export const BASE_POINTS = 1000
export const SPEED_BONUS = 500

/** 500 when the answer lands as the question opens, 0 at the buzzer. */
export function speedBonus(at: number, startedAt: number, deadlineMs: number) {
  const span = deadlineMs - startedAt
  if (!(span > 0) || !Number.isFinite(at)) return 0
  const ratio = Math.min(1, Math.max(0, (deadlineMs - at) / span))
  return Math.round(SPEED_BONUS * ratio)
}

function sameNumber(a: number, b: number) {
  return Math.abs(a - b) < 1e-6
}

/**
 * Choice and true/false: 1000 if right, plus up to 500 for speed. Wrong or
 * blank is 0.
 * Closest number: 1000 plus speed if exact. Otherwise
 * round(1000 * closeness), where closeness is 1 at the answer and 0 once
 * the guess is a full |answer| away (or 1 away, when the answer is 0).
 * No speed bonus on an inexact number. Players are scored against the
 * truth, not against each other.
 */
export function pointsFor(
  question: TriviaQuestion,
  answer: StoredAnswer | null,
  startedAt: number,
  deadlineMs: number,
) {
  if (!answer) return 0
  if (question.kind === 'choice') {
    if (answer.kind !== 'choice' || answer.index !== question.answer) return 0
    return BASE_POINTS + speedBonus(answer.at, startedAt, deadlineMs)
  }
  if (question.kind === 'boolean') {
    if (answer.kind !== 'boolean' || answer.value !== question.answer) return 0
    return BASE_POINTS + speedBonus(answer.at, startedAt, deadlineMs)
  }
  if (answer.kind !== 'number' || !Number.isFinite(answer.value)) return 0
  if (sameNumber(answer.value, question.answer)) {
    return BASE_POINTS + speedBonus(answer.at, startedAt, deadlineMs)
  }
  const scale = Math.max(Math.abs(question.answer), 1)
  const closeness = Math.max(0, 1 - Math.abs(answer.value - question.answer) / scale)
  return Math.round(BASE_POINTS * closeness)
}

export function isExact(question: TriviaQuestion, answer: StoredAnswer | null) {
  if (!answer) return false
  if (question.kind === 'choice') return answer.kind === 'choice' && answer.index === question.answer
  if (question.kind === 'boolean') return answer.kind === 'boolean' && answer.value === question.answer
  return answer.kind === 'number' && sameNumber(answer.value, question.answer)
}
