document.addEventListener("DOMContentLoaded", getPokemonDetails);

async function getPokemonDetails() {
    const params = new URLSearchParams(window.location.search);
    const pokemonId = params.get("id");

    if (!pokemonId) {
        showError("Pokémon não encontrado.");
        return;
    }

    try {
        const [pokemon, speciesData] = await Promise.all([
            fetchData(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`),
            fetchData(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
        ]);

        if (!pokemon || !speciesData) throw new Error();

        updatePokemonInfo(pokemon, speciesData);
        getEvolutionChain(speciesData.evolution_chain.url);
    } catch (error) {
        showError("Erro ao carregar os dados do Pokémon.");
        console.error(error);
    }
}

/** 🔹 Faz uma requisição para a API */
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar ${url}`, error);
        return null;
    }
}

/** 🔹 Exibe os detalhes do Pokémon */
function updatePokemonInfo(pokemon, speciesData) {
    const { id, name, height, weight, base_experience, stats, abilities, types } = pokemon;

    const genderRate = speciesData.gender_rate;
    const genderText = genderRate === 0 ? "Apenas Masculino" :
                       genderRate === 8 ? "Apenas Feminino" :
                       genderRate === -1 ? "Sem Gênero" : "Ambos os Gêneros";

    const description = speciesData.flavor_text_entries.find(entry => entry.language.name === "en")?.flavor_text.replace(/\n|\f/g, ' ') || "Descrição não encontrada.";

    document.getElementById("pokemon-name").innerText = name.toUpperCase();
    document.getElementById("pokemon-info").innerHTML = `
        <h2>Dados Pokédex</h2>
        <div class="pokemon-card">
            <div class="pokemon-image">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" alt="${name}">
            </div>
            <div class="pokemon-data">
                <span class="pokemon-id">ID: ${id}</span>
                <ul class="pokemon-attributes">
                    <li><strong>Nome:</strong> ${name}</li>
                    <li><strong>Altura:</strong> ${height / 10} m</li>
                    <li><strong>Peso:</strong> ${weight / 10} kg</li>
                    <li><strong>Tipagem:</strong> <span id="pokemon-types"></span></li>
                    <li><strong>Experiência Base:</strong> ${base_experience || "Desconhecido"}</li>
                    <li><strong>Taxa de Captura:</strong> ${speciesData.capture_rate}</li>
                    <li><strong>Geração:</strong> ${speciesData.generation.name.replace("generation-", "").toUpperCase()}</li>
                    <li><strong>Taxa de Gênero:</strong> ${genderText}</li>
                </ul>
            </div>
        </div>
        <h2>Status Base</h2>
        <div class="stats-container" id="stats-container"></div>
        <h2>Habilidades</h2>
        <div class="abilities-container" id="abilities-container"></div>
        <h2>Descrição do Pokémon</h2>
        <p class="pokedex-description" id="pokedex-description">${description}</p>
        <h2>Linha Evolutiva</h2>
        <div class="evolution-container" id="evolution-container"></div>
    `;

    displayStats(stats);
    displayAbilities(abilities);
    displayPokemonTypes(types);

    traduzirTexto(description)
        .then(traducao => {
            document.getElementById("pokedex-description").innerText = traducao;
        })
        .catch(error => console.error("Erro ao traduzir a descrição:", error));
}

/** 🔹 Exibe os status do Pokémon */
function displayStats(stats) {
    const statsContainer = document.getElementById("stats-container");
    statsContainer.innerHTML = stats.map(stat => {
        const statName = stat.stat.name.replace("special-attack", "Sp. Atk")
                                      .replace("special-defense", "Sp. Def")
                                      .toUpperCase();
        const statValue = stat.base_stat;
        return `
            <div class="stat-row">
                <span class="stat-name">${statName}</span>
                <span class="stat-value">${statValue}</span>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${(statValue / 255) * 100}%;"></div>
                </div>
            </div>
        `;
    }).join("");
}

/** 🔹 Exibe as habilidades */
function displayAbilities(abilities) {
    document.getElementById("abilities-container").innerHTML = abilities
        .map(a => `<span class="ability">${a.ability.name}</span>`)
        .join("");
}

/** 🔹 Exibe os tipos do Pokémon */
function displayPokemonTypes(types) {
    document.getElementById("pokemon-types").innerHTML = types
        .map(t => `<span class="pokemon-type type-${t.type.name.toLowerCase()}">${t.type.name.toUpperCase()}</span>`)
        .join("");
}

/** 🔹 Obtém e exibe a linha evolutiva */
async function getEvolutionChain(evolutionUrl) {
    const evolutionData = await fetchData(evolutionUrl);
    if (!evolutionData) return;

    let evolutionChain = [];
    let chain = evolutionData.chain;

    while (chain) {
        const evoId = chain.species.url.split("/").slice(-2, -1)[0];
        evolutionChain.push({ id: evoId, name: chain.species.name });
        chain = chain.evolves_to.length > 0 ? chain.evolves_to[0] : null;
    }

    displayEvolutionChain(evolutionChain);
}

/** 🔹 Exibe a linha evolutiva */
function displayEvolutionChain(evolutionChain) {
    const evolutionContainer = document.getElementById("evolution-container");
    evolutionContainer.innerHTML = evolutionChain.map(evo => `
        <div class="card" onclick="window.location.href='pokemon.html?id=${evo.id}'">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png" alt="${evo.name}">
            <p>${evo.name}</p>
        </div>
    `).join("");
}

/** 🔹 Traduz a descrição do Pokémon */
async function traduzirTexto(texto) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        return dados[0].map(parte => parte[0]).join("");
    } catch (error) {
        console.error("Erro ao traduzir texto:", error);
        return texto;
    }
}

/** 🔹 Exibe mensagens de erro */
function showError(message) {
    document.getElementById("pokemon-info").innerHTML = `<p>${message}</p>`;
}
