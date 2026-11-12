<script setup lang="ts"></script>

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
  </section>
</template>
