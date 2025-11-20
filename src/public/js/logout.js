function logout() {
  fetch("/user/logout", {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      localStorage.clear();
      window.location.href = "/";
    })
    .catch((err) => showMessage(err, "error"));
}
