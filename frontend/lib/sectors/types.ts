export type Sector = {
  id: string;
  name: string;
  location: string;
  reservableQuota: number;
  availableSpots: number;
  hourlyRate: number;
  createdAt: string;
};

export type CreateSectorPayload = Pick<
  Sector,
  "name" | "location" | "reservableQuota" | "hourlyRate"
>;

export type ApiResponse<T> = {
  data: T;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};
