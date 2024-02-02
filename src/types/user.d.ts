export type User = {
  name: string,
  email: string,
  image: string,
};

export type Credentials = {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expiry_date: number;
};
