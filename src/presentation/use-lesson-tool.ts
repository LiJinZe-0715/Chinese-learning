import { useEffect } from 'react';
import { registerBrowserLessonTool } from '../bootstrap';
import type { ModelContext } from '../bootstrap';
export function useLessonTool(
  total: number,
  openLesson: (index: number) => void,
) {
  useEffect(
    () =>
      registerBrowserLessonTool(
        (document as Document & { modelContext?: ModelContext }).modelContext,
        openLesson,
      ),
    [total, openLesson],
  );
}
