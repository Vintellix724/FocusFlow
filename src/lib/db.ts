import localforage from 'localforage';

export type MockTest = {
  id: string;
  title: string;
  date: string;
  coachingName?: string;
  
  questionPaperFile?: Blob | null;
  answerKeyFile?: Blob | null;
  syllabusFile?: Blob | null;
  
  questionPaperName?: string;
  answerKeyName?: string;
  syllabusName?: string;

  isAttempted: boolean;
  correctAnswers?: number;
  incorrectAnswers?: number;
  marksObtained?: number;
  totalMarks?: number;
  timeAllocated?: number;
  timeTaken?: number;
};

const db = localforage.createInstance({
  name: 'StudyPlannerApp',
  storeName: 'mock_tests'
});

export const saveMockTest = async (test: MockTest) => {
  await db.setItem(test.id, test);
};

export const getMockTests = async (): Promise<MockTest[]> => {
  const tests: MockTest[] = [];
  await db.iterate((value: MockTest) => {
    tests.push(value);
  });
  return tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getMockTest = async (id: string): Promise<MockTest | null> => {
  return await db.getItem<MockTest>(id);
};

export const deleteMockTest = async (id: string) => {
  await db.removeItem(id);
};
