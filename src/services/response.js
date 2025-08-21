export const response = (status, data, message) => {
    return { success: status, data: data, message: message }
}