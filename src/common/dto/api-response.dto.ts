export interface ApiSuccessResponse<T> {
  isSuccess: true;
  message: string;
  data: T;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  isSuccess: false;
  message: string;
  errors?: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
