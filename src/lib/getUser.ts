import type { User } from '@/types/user';

const emptyUser: User = {
  name: '',
  email: '',
  image: '',
  isLoggedIn: false,
};

export default async function getUser(): Promise<User> {
  try {
    const res = await window.gapi.client.people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos',
    });

    return {
      name: res.result.names?.[0].displayName as string,
      email: res.result.emailAddresses?.[0].value as string,
      image: res.result.photos?.[0].url as string,
      isLoggedIn: true,
    };
  } catch {
    return emptyUser;
  }
}
