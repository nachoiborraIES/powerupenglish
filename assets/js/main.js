function checkAnswers() {
    const inputs = document.querySelectorAll('.quiz-input');
    const feedback = document.getElementById('quiz-feedback');
    let allCorrect = true;

    inputs.forEach(input => {
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = input.getAttribute('data-answer').toLowerCase();

        if (userAnswer === correctAnswer) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
            allCorrect = false;
        }
    });

    if (allCorrect) {
        feedback.className = "mt-3 fw-bold text-success";
        feedback.innerText = "¡Perfecto! Has dominado esta píldora. 🚀";
    } else {
        feedback.className = "mt-3 fw-bold text-danger";
        feedback.innerText = "Algunas respuestas no son correctas. ¡Inténtalo de nuevo!";
    }
}