export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data: T;
  status: "success" | "error";
  message?: string;
}
