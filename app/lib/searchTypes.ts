export type SearchResult = {
  id?: string;
  name: string;
  href: string;
  isFolder: boolean;
};

export type SearchResponse = {
  results: SearchResult[];
};
