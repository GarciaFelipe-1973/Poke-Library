document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("pokemon-container");
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const pageNumber = document.getElementById("pageNumber");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const clearButton = document.getElementById("clearButton");

    let currentPage = 1;
    const limit = 30;
    const maxPokemons = 1025;
    let isSearching = false;
    let allPokemons = [];

    /** 🔹 Obtém todos os Pokémon para busca */
    async function fetchAllPokemons() {
        try {
            const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
            const data = await response.json();
            allPokemons = data.results.map((pokemon, index) => ({
                id: index + 1,
                name: pokemon.name
            }));
        } catch (error) {
            console.error("Erro ao carregar todos os Pokémon", error);
        }
    }

    /** 🔹 Obtém os Pokémon da página atual */
    async function getPokemons(page) {
        if (isSearching) return;

        try {
            container.innerHTML = '<p>Carregando...</p>';
            const offset = (page - 1) * limit;
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
            const data = await response.json();

            container.innerHTML = '';
            data.results.forEach((pokemon, index) => {
                showPokemonCard(offset + index + 1, pokemon.name);
            });

            updatePageState(page, false);
        } catch (error) {
            console.error("Erro ao carregar Pokémon", error);
            container.innerHTML = '<p>Erro ao carregar Pokémon</p>';
        }
    }

    /** 🔹 Exibe um card de Pokémon */
    function showPokemonCard(id, name) {
        const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${baseUrl}${id}.png" alt="${name}" data-id="${id}">
            <p>${name}</p>
        `;

        card.querySelector("img").addEventListener("click", () => {
            window.location.href = `pokemon.html?id=${id}`;
        });

        container.appendChild(card);
    }

    /** 🔹 Atualiza a interface da paginação */
    function updatePageState(page, isSearchMode) {
        pageNumber.innerText = isSearchMode ? "Resultado da busca" : `Página ${page}`;
        prevButton.disabled = page === 1;
        nextButton.disabled = isSearchMode || page * limit >= maxPokemons;
    }

    /** 🔹 Busca um Pokémon pelo nome ou ID */
    async function searchPokemon() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        isSearching = true;
        localStorage.setItem("searchQuery", query);
        container.innerHTML = '<p>Buscando...</p>';
        clearButton.classList.remove("hidden");
        searchButton.classList.add("hidden");

        if (!isNaN(query)) {
            try {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
                if (!response.ok) throw new Error();
                const pokemon = await response.json();
                
                container.innerHTML = '';
                showPokemonCard(pokemon.id, pokemon.name);
                updatePageState(null, true);
                return;
            } catch {
                container.innerHTML = '<p>Pokémon não encontrado!</p>';
                return;
            }
        }

        const matchingPokemons = allPokemons.filter(pokemon => pokemon.name.includes(query));

        if (matchingPokemons.length === 0) {
            container.innerHTML = '<p>Nenhum Pokémon encontrado!</p>';
            return;
        }

        container.innerHTML = '';
        matchingPokemons.forEach(pokemon => showPokemonCard(pokemon.id, pokemon.name));

        updatePageState(null, true);
    }

    /** 🔹 Limpa a busca e volta à lista */
    function clearSearch() {
        searchInput.value = "";
        localStorage.removeItem("searchQuery");
        isSearching = false;
        clearButton.classList.add("hidden");
        searchButton.classList.remove("hidden");
        getPokemons(currentPage);
    }

    /** 🔹 Navegação entre páginas */
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            getPokemons(currentPage);
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentPage * limit < maxPokemons) {
            currentPage++;
            getPokemons(currentPage);
        }
    });

    searchButton.addEventListener("click", searchPokemon);
    clearButton.addEventListener("click", clearSearch);

    await fetchAllPokemons();
    clearSearch();
    getPokemons(currentPage);

    /** 🔹 Verifica se há uma busca salva */
    const savedQuery = localStorage.getItem("searchQuery");
    if (savedQuery) {
        searchInput.value = savedQuery;
    }
});
