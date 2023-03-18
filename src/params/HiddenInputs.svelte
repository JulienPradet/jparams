<script lang="ts">
	import { InitialiazedParam, Param, paramSerializer } from './defineParams';

	type P = $$Generic<Param>;

	export let name: string;
	export let param: InitialiazedParam<P>;
	export let value: InitialiazedParam<P>['value'];

	const formValues = paramSerializer[param.type].serialize(value);
</script>

{#if Array.isArray(formValues)}
	{#each formValues as value, index}
		<input type="hidden" name={`${name}[${index}]`} {value} />
	{/each}
{:else}
	<input type="hidden" {name} value={formValues} />
{/if}
