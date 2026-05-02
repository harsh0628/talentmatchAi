function lowercaseFirst(value) {
	if (!value) {
		return value;
	}

	return value.charAt(0).toLowerCase() + value.slice(1);
}

function toPlural(word) {
	if (!word) {
		return word;
	}

	if (word.endsWith('s')) {
		return `${word}es`;
	}

	return `${word}s`;
}

function createGenericService(Model, sortOptions = { createdAt: -1 }) {
	const modelName = Model.modelName || 'Record';
	const pluralModelName = toPlural(modelName);

	const listMethodName = `list${pluralModelName}`;
	const getByIdMethodName = `get${modelName}ById`;
	const createMethodName = `create${modelName}`;
	const updateMethodName = `update${modelName}`;
	const removeMethodName = `remove${modelName}`;

	const baseService = {
		async list() {
			return Model.find().sort(sortOptions);
		},
		async getById(id) {
			return Model.findById(id);
		},
		async create(payload) {
			return Model.create(payload);
		},
		async update(id, payload) {
			return Model.findByIdAndUpdate(id, payload, {
				new: true,
				runValidators: true,
			});
		},
		async remove(id) {
			return Model.findByIdAndDelete(id);
		},
	};

	return {
		...baseService,
		[listMethodName]: baseService.list,
		[getByIdMethodName]: baseService.getById,
		[createMethodName]: baseService.create,
		[updateMethodName]: baseService.update,
		[removeMethodName]: baseService.remove,
		[`list${lowercaseFirst(pluralModelName)}`]: baseService.list,
		[`get${lowercaseFirst(modelName)}ById`]: baseService.getById,
		[`create${lowercaseFirst(modelName)}`]: baseService.create,
		[`update${lowercaseFirst(modelName)}`]: baseService.update,
		[`remove${lowercaseFirst(modelName)}`]: baseService.remove,
	};
}

module.exports = createGenericService;
