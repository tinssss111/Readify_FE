import envConfig from "@/configs/config-env";

type CustomOptions = RequestInit & {
  baseUrl?: string | undefined;
};

const ENTITY_ERROR_STATUS = 422;

interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

type EntityErrorPayload = {
  message: string;
  errorCode: string;
  statusCode: number;
  details?: ErrorDetail[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: any;
  };
  message: string;
  constructor(status: number, message: string, payload: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: number = ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: number;
    payload: EntityErrorPayload;
  }) {
    super(status, "Entity error", payload);
    this.payload = payload;
    this.status = status;
  }
}

const request = async <Response>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  options: CustomOptions | undefined
) => {
  const body =
    options?.body instanceof FormData
      ? options.body
      : options?.body
      ? JSON.stringify(options.body)
      : undefined;
  const baseHeaders =
    options?.body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
        };

  // nếu baseUrl không được cung cấp thì sử dụng NEXT_PUBLIC_API_ENDPOINT từ env
  // nếu baseUrl được cung cấp thì sử dụng baseUrl
  // nếu baseUrl là rỗng thì gọi đến next server
  const baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_API_ENDPOINT
      : options.baseUrl;

  const fullUrl = url.startsWith("/")
    ? `${baseUrl}${url}`
    : `${baseUrl}/${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options?.headers as Record<string, string>),
    } as HeadersInit,
    body,
    method,
    credentials: "include",
  });

  const payload: Response = await response.json();
  const data = {
    status: response.status,
    payload,
  };

  if (!response.ok) {
    // lỗi liên quan đến dữ liệu
    if (response.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: number;
          payload: EntityErrorPayload;
        }
      );
    } else {
      // lỗi server
      throw new HttpError(response.status, response.statusText, payload);
    }
  }

  return data;
};

const http = {
  get: <Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("GET", url, options),

  post: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("POST", url, { ...options, body }),

  put: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("PUT", url, { ...options, body }),

  delete: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("DELETE", url, { ...options, body }),
};

export default http;
