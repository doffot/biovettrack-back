import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
      return  bcrypt.hashSync(password, salt);
}

export const checkPassword = async (password: string, hash: string) => {
    return await bcrypt.compareSync(password, hash);
}