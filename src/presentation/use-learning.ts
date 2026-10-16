import { useCallback, useReducer, useRef } from 'react';
import { learningApplication } from '../bootstrap';
import { initialSession } from '../domain/learning';
import type { LearningAction, LearningSession } from '../domain/learning';
import { useLessonTool } from './use-lesson-tool';
import { PAGE_SIZE } from './pagination';
interface ViewState {
  session: LearningSession;
  listPage: number;
}
type ViewAction =
  | LearningAction
  | { type: 'page'; change: (page: number) => number };
function reduceView(state: ViewState, action: ViewAction): ViewState {
  if (action.type === 'page')
    return { ...state, listPage: action.change(state.listPage) };
  const session = learningApplication.transition(state.session, action);
  return {
    session,
    listPage:
      session.index !== state.session.index ||
      action.type === 'open' ||
      action.type === 'review'
        ? Math.floor(
            (learningApplication.view(session).lesson.order - 1) / PAGE_SIZE,
          )
        : state.listPage,
  };
}
export function useLearning() {
  const [{ session, listPage }, dispatch] = useReducer(reduceView, {
    session: initialSession,
    listPage: 0,
  });
  const setListPage = (change: (page: number) => number) =>
    dispatch({ type: 'page', change });
  const heading = useRef<HTMLHeadingElement>(null);
  const view = learningApplication.view(session);
  const act = useCallback((action: LearningAction, focus = false) => {
    dispatch(action);
    if (focus)
      requestAnimationFrame(() => {
        heading.current?.focus();
        heading.current?.scrollIntoView({
          block: 'start',
          behavior: 'instant',
        });
      });
  }, []);
  const openLesson = useCallback(
    (index: number, focus = false) => act({ type: 'open', index }, focus),
    [act],
  );
  useLessonTool(view.total, openLesson);
  return {
    ...session,
    ...view,
    nextLabel: {
      summary: '学習を振り返る',
      lesson: '次のレッスンへ',
      level: '次の級へ進む',
    }[view.nextStep],
    done: session.completed,
    heading,
    listPage,
    setListPage,
    openLesson,
    pages: Math.ceil(view.course.length / PAGE_SIZE),
    visible: view.course.slice(
      listPage * PAGE_SIZE,
      (listPage + 1) * PAGE_SIZE,
    ),
    setTab: (tab: 'learn' | 'quiz') => act({ type: 'show', tab }),
    setChoice: (choice: number) => act({ type: 'choose', choice }),
    check: () => act({ type: 'check' }),
    retry: () => act({ type: 'retry' }),
    continueLearning: () => act({ type: 'continue' }, true),
    review: () => act({ type: 'review' }, true),
    previous: () => act({ type: 'previous' }, true),
    next: () => act({ type: 'next' }, true),
  };
}
