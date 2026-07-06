const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function post<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}