import * as argon2 from 'argon2';

const options = {
  timeCost: 5,
};

export async function hashPassword(password: string) {
  return await argon2.hash(password, options);
}

export async function passwordEquals(hash: string, password: string) {
  return await argon2.verify(hash, password);
}
