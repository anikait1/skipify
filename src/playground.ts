import { api } from ".";

try {
    console.log(await api.currentlyPlaying())
} catch (error) {
    console.log(error.context.request, error.context.response)
}