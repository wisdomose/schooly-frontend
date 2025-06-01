export interface ApiResponse<T> {
  message: string;
  status: number;
  data: T;
}

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};
