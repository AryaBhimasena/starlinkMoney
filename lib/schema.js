export const validateUserSchema = (data) => {
    const schema = {
        nama: "string",
        email: "string",
        role: "string", // Harus "superadmin" atau "admin"
        entitasId: "string"
    };
    
    for (const key in schema) {
        if (!data[key] || typeof data[key] !== schema[key]) {
            return `Field '${key}' harus bertipe ${schema[key]} dan tidak boleh kosong`;
        }
    }
    
    if (!["superadmin", "admin"].includes(data.role)) {
        return "Role harus 'superadmin' atau 'admin'";
    }
    
    return null; // Tidak ada error
};
