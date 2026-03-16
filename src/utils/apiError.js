export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong') {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallbackMessage
    );
}
