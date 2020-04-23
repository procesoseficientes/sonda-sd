class Microencuesta {
    id: number;
    name: string;
    validDateFrom: Date;
    validDateTo: Date;
    order: number; 
    isMandatory: number;
    applyIn: DisparadorDeEncuesta;
    questions: Pregunta[];
    answersOfUser: Respuesta[];
    isFromDraft: boolean;
    channelsOnQuiz: number;
}
