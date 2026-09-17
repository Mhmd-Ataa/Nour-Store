const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "nour_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();

  let res;

  const isFormData = body instanceof FormData;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(isFormData
          ? {}
          : { "Content-Type": "application/json" }),

        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },

      body:
        body !== undefined
          ? isFormData
            ? body
            : JSON.stringify(body)
          : undefined,
    });
  } catch (err) {
    throw new Error(
      "تعذر الاتصال بالخادم، تأكدي إن السيرفر شغال على " 
    );
  }

  let data = {};

  try {
    data = await res.json();
  } catch (_) {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error(
      data.message ||
        "حدث خطأ ما، حاولي مرة أخرى"
    );
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: "POST", body }),
  put: (path, body) =>
    request(path, { method: "PUT", body }),
  patch: (path, body) =>
    request(path, { method: "PATCH", body }),
  del: (path) =>
    request(path, { method: "DELETE" }),
  setToken,
  getToken,
};