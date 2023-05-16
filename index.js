const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];

const updatePaginationDiv = (currentPage, numPages) => {
	$('#pagination').empty();

	const radius = 2;
	const startPage = Math.max(currentPage - radius, 1);
	const endPage = Math.min(currentPage + radius, numPages);

	$('#pagination').append(`
    <button class="btn btn-primary prevButton" style="${currentPage === 1 ? 'display: none;' : ''}">Prev</button>
  `);

	for (let i = startPage; i <= endPage; i++) {
		$('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons ${
				i === currentPage ? 'current' : ''
			}" value="${i}">${i}</button>
    `);
	}

	$('#pagination').append(`
    <button class="btn btn-primary nextButton" style="${currentPage === numPages ? 'display: none;' : ''}">Next</button>
  `);
};

const updatePokemonCounts = (currentCount, totalCount) => {
	$('#current-count-value').text(currentCount);
	$('#total-count-value').text(totalCount);
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
	selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

	const currentCount = selected_pokemons.length;
	updatePokemonCounts(currentCount, pokemons.length);

	$('#pokeCards').empty();
	selected_pokemons.forEach(async (pokemon) => {
		const res = await axios.get(pokemon.url);
		$('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h4>${res.data.name.toUpperCase()}</h4> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
        </div>  
        `);
	});
};

let types = [];
axios
	.get('https://pokeapi.co/api/v2/type')
	.then((response) => {
		types = response.data.results.map((result) => result.name);
		createTypeFilters(types);
	})
	.catch((error) => {
		console.error(error);
	});

const filterByTypes = (types) => {
	filteredPokemons = pokemons.filter((pokemon) => types.every((type) => pokemon.types.includes(type)));
	currentPage = 1;
	const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
	paginate(currentPage, PAGE_SIZE, filteredPokemons);
	updatePaginationDiv(currentPage, numPages);
};

const createTypeFilters = (types) => {
	const container = document.getElementById('typeFilter');
	const checkboxGroup = document.createElement('div');
	checkboxGroup.classList.add('checkbox-group');

	types.forEach((type) => {
		const checkboxContainer = document.createElement('div');
		checkboxContainer.classList.add('custom-control', 'custom-checkbox', 'mr-3', 'mb-2');

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.value = type;
		checkbox.id = `checkbox-${type}`;
		checkbox.classList.add('custom-control-input');

		const label = document.createElement('label');
		label.classList.add('custom-control-label');
		label.htmlFor = `checkbox-${type}`;
		label.innerText = type;

		checkboxContainer.appendChild(checkbox);
		checkboxContainer.appendChild(label);
		checkboxGroup.appendChild(checkboxContainer);
	});

	container.appendChild(checkboxGroup);

	container.addEventListener('change', () => {
		const checkedTypes = [];
		types.forEach((type) => {
			const checkbox = document.getElementById(`checkbox-${type}`);
			if (checkbox.checked) {
				checkedTypes.push(type);
			}
		});
		filterByTypes(checkedTypes);
	});
};

const getCheckedTypes = () => {
	const checkedTypes = [];
	types.forEach((type) => {
		const checkbox = document.getElementById(`checkbox-${type}`);
		if (checkbox.checked) {
			checkedTypes.push(type);
		}
	});
	return checkedTypes;
};

const setup = async () => {
	$('#pokeCards').empty();
	let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
	pokemons = await Promise.all(
		response.data.results.map(async (pokemon) => {
			const details = await axios.get(pokemon.url);
			return {
				...pokemon,
				types: details.data.types.map((type) => type.type.name),
				details: details.data,
			};
		})
	);
	filteredPokemons = pokemons;
	paginate(currentPage, PAGE_SIZE, pokemons);
	const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
	updatePaginationDiv(currentPage, numPages);
	updatePokemonCounts(10, pokemons.length);

	$('body').on('click', '.pokeCard', async function (e) {
		const pokemonName = $(this).attr('pokeName');
		const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
		const types = res.data.types.map((type) => type.type.name);
		$('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `);
		$('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `);
	});

	$('body').on('click', '.numberedButtons', async function (e) {
		currentPage = Number(e.target.value);
		paginate(currentPage, PAGE_SIZE, filteredPokemons);

		const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
		updatePaginationDiv(currentPage, numPages);
	});

	$('body').on('click', '.prevButton', async function (e) {
		if (currentPage > 1) {
			currentPage--;
			paginate(currentPage, PAGE_SIZE, filteredPokemons);
			const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
			updatePaginationDiv(currentPage, numPages);
		}
	});

	$('body').on('click', '.nextButton', async function (e) {
		const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
		if (currentPage < numPages) {
			currentPage++;
			paginate(currentPage, PAGE_SIZE, filteredPokemons);
			updatePaginationDiv(currentPage, numPages);
		}
	});
};

$(document).ready(setup);
