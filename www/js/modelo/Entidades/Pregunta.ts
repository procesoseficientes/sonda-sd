class Pregunta {
    id: number;
    microsurveyId: number;
    question: string;
    order: number;
    required: number;
    typeQuestion: TipoDePregunta;
    answers: Respuesta[] = [];
    answersOfUser: Respuesta[] = [];
}
