export type Chunk = {
  id: string; // e.g. SRC-001#p4-c2
  sourceId: string; // e.g. SRC-001
  title: string;
  issuer: string;
  lang: "en" | "am" | "mixed";
  url: string | null;
  page: number | null;
  status: "current" | "historical" | "unknown";
  text: string;
  embedding: number[];
};

export type KnowledgeIndex = {
  builtAt: string | null;
  embeddingModel: string | null;
  chunks: Chunk[];
};
