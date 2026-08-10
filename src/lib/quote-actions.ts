export type ClientQuoteAction = "edit" | "preview" | "download" | "link" | "send";

export function getClientQuoteActions(status: string): ClientQuoteAction[] {
  if (status === "Brouillon" || status === "Refusé") {
    return ["edit", "preview", "download", "link", "send"];
  }
  if (status === "Envoyé" || status === "Vu" || status === "Expiré") {
    return ["preview", "download", "link", "send"];
  }
  return ["preview", "download", "link"];
}
