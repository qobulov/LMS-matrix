export const formatPrice = (amount) => {
  if (!amount) return "Free";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
};

export const capitalize = (value = "") =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const formatDate = (isoDate) => {
  if (!isoDate) return "-";
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
};
