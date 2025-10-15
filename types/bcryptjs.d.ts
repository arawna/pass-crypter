declare module "bcryptjs" {
  interface Bcryptjs {
    hash(data: string | Buffer, salt: string | number): Promise<string>;
    hashSync(data: string | Buffer, salt: string | number): string;
    compare(data: string | Buffer, encrypted: string): Promise<boolean>;
    compareSync(data: string | Buffer, encrypted: string): boolean;
    genSalt(rounds?: number): Promise<string>;
    genSaltSync(rounds?: number): string;
  }

  const bcrypt: Bcryptjs;

  export const hash: Bcryptjs["hash"];
  export const hashSync: Bcryptjs["hashSync"];
  export const compare: Bcryptjs["compare"];
  export const compareSync: Bcryptjs["compareSync"];
  export const genSalt: Bcryptjs["genSalt"];
  export const genSaltSync: Bcryptjs["genSaltSync"];

  export default bcrypt;
}
