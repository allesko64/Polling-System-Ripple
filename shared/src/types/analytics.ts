export interface QuestionStat{
    questionId: string;
    question: string;
    options: OptionStat[];

}
export interface OptionStat{
    optionId: string;
    option: string;
    count: number;
    percentage: number;
}
export interface PollAnalytics{
    id: string;
    totalResponses: number;
    question: QuestionStat[];
    timeline: TimelineEntry[];
}

export interface TimelineEntry {
  hour: Date
  count: number
}