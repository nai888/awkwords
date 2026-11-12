<script setup lang="ts">
const canAddRow = true
</script>

<template>
  <section class="main-section" aria-labelledby="subpatterns-heading">
    <header class="section-head">
      <h2 id="subpatterns-heading">Subpatterns</h2>
      <p class="hint">
        Name a fragment with a capital letter, then use that letter in any pattern.
      </p>
    </header>
    <ul class="rows">
      <!-- use v-for to loop through rows in State -->
      <li class="row">
        <input
          class="input mono name"
          type="text"
          maxlength="1"
          autocomplete="off"
          spellcheck="false"
          placeholder="A"
        />
        <span class="equals" aria-hidden="true">=</span>
        <input
          class="input mono value"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="a/e/i/o/u"
        />
        <button
          type="button"
          class="btn icon"
          title="Edit option weights"
          aria-label="`Edit weights for subpattern`"
          disabled
        >
          &#x2699;
        </button>
        <button
          type="button"
          class="btn icon"
          title="Remove subpattern"
          aria-label="`Remove subpattern`"
          disabled
        >
          &#x2715;
        </button>
      </li>
    </ul>
    <button type="button" class="btn subtle wide" :disabled="!canAddRow">+ Add Subpattern</button>
  </section>
  <section class="main-section" aria-labelledby="pattern-heading">
    <header class="section-head row-head">
      <h2 id="pattern-heading">Pattern</h2>
      <p class="hint">
        Use <code>/</code> to choose, <code>[ ]</code> to group, <code>( )</code> to make optional,
        <code>*x</code> for weights, <code>^y</code> to filter, and <code>"&hellip;"</code> to
        escape.
      </p>
    </header>
    <div class="row">
      <input
        class="input mono value"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="CV(N)"
      />
      <button
        type="button"
        class="btn icon"
        title="Edit option weights"
        aria-label="`Edit weights for subpattern`"
        disabled
      >
        &#x2699;
      </button>
    </div>
  </section>
</template>
