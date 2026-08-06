const API_BASE_URL = "http://127.0.0.1:8000";

export async function generateVoice(payload) {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to generate voice");
  }

  return response.blob();
}

export async function parseTags(text, emotion) {
  const response = await fetch(`${API_BASE_URL}/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, emotion }),
  });

  if (!response.ok) {
    throw new Error("Failed to parse text");
  }

  const data = await response.json();
  return data.segments;
}
