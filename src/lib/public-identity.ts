export interface IdentitySource {
  id: string;
  username: string;
}

export function toPublicIdentity(user: IdentitySource) {
  if (/^tsu_\d+$/i.test(user.username)) return {
    id: user.id,
    label: "Anonym",
    handle: null,
    imageAlt: "Anonym",
    profileHref: null,
    isAnonymous: true,
  };

  const handle = `@${user.username}`;
  return {
    id: user.id,
    label: handle,
    handle,
    imageAlt: handle,
    profileHref: `/u/${user.username}`,
    isAnonymous: false,
  };
}
