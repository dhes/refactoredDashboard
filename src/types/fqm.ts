export interface ClauseResult {
  html: string;
  // add other properties as needed
}

export interface DetailedResults {
  clauseResults: ClauseResult[];
  // add other properties as needed
}

export interface FQMResult {
  detailedResults: DetailedResults;
  // add other properties as needed
}

export interface MeasureLogicHighlighting {
  cleanHtml: string;
  rawHtml: string;
}