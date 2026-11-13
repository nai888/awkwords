<script setup lang="ts">
import { version as VERSION } from '../../package.json'
import { ref } from 'vue'

const dialog = ref<HTMLDialogElement | null>(null)

function open(): void {
  dialog.value?.showModal()
}

function close(): void {
  dialog.value?.close()
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialog.value) {
    close()
  }
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialog" class="help" aria-labelledby="help-title" @click="onBackdropClick">
    <article class="help-body">
      <header class="help-head">
        <h2 id="help-title">Awkwords v{{ VERSION }} Help</h2>
        <button type="button" class="btn icon" aria-label="Close help" @click="close">×</button>
      </header>
      <p>
        Awkwords randomly generates words from a pattern. Use it for words in a constructed
        language, nicknames, memorable passwords, or just for fun.
      </p>
      <h3>Concept</h3>
      <p>
        The <em>pattern</em> defines how a word is built. It is built using subpatterns, literals,
        and other syntax described below. <em>Subpatterns</em> behave exactly like patterns, except
        they can be reused in other subpatterns or in the main pattern. Some typical subpatterns
        include vowels (V), consonants (C), and nasals (N).
      </p>
      <h3>Basic syntax</h3>
      <table>
        <tbody>
          <tr>
            <th><code>a</code></th>
            <td>
              Any lowercase letter is treated literally.<br />
              <code>tu</code> &rarr; <i>tu</i>
            </td>
          </tr>
          <tr>
            <th><code>/</code></th>
            <td>
              Splits multiple options; one is chosen at random.<br />
              <code>tu/top/kan</code> &rarr; <i>tu</i>, <i>top</i>, or <i>kan</i>
            </td>
          </tr>
          <tr>
            <th><code>[ ]</code></th>
            <td>
              Treats the content as one unit.<br />
              <code>s[tu/top/kan]</code> &rarr; <i>stu</i>, <i>stop</i>, or <i>skan</i>
            </td>
          </tr>
          <tr>
            <th><code>( )</code></th>
            <td>
              Like <code>[ ]</code>, but the content appears only half of the time.<br />
              <code>s(tu/top/kan)</code> &rarr; <i>s</i>, <i>stu</i>, <i>stop</i>, or <i>skan</i>
            </td>
          </tr>
          <tr>
            <th>empty</th>
            <td>
              Options can be empty.<br />
              <code>[a/]</code> &rarr; <i>a</i> or nothing
            </td>
          </tr>
          <tr>
            <th><code>A</code></th>
            <td>
              A capital letter references a subpattern.<br />
              If <code>A</code> = <code>tu/top/kan</code>, then <code>sA</code> &rarr; <i>stu</i>,
              <i>stop</i>, or <i>skan</i>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Brackets nest without limit: <code>at(a(z))</code> gives <i>at</i>, <i>ata</i>, or
        <i>ataz</i>, but never <i>atz</i>. Spaces outside quotes are ignored.
      </p>
      <h3>Weights</h3>
      <p>
        Write <code>*</code> and a whole number from 1 to 128 after an option to multiply its
        chance. Options without a weight have weight 1.
      </p>
      <p>
        <code>a/b*3/c/d/kek*6</code> &rarr; <i>b</i> is three times as likely as <i>a</i>, <i>c</i>,
        or <i>d</i>; <i>kek</i> is six times as likely.
      </p>
      <p>
        The &#x2696; buttons open a helper where you can adjust the weight of each top-level option
        with + / &#x2212; and see its chance as a percentage. It writes the <code>*N</code> markers
        into the pattern for you.
      </p>
      <h3>Escaping</h3>
      <p>
        Text in double quotes is copied as-is, so capital letters, slashes, brackets and so on can
        be generated. <code>heh"[mY/worD)]"</code> &rarr; <i>heh[mY/worD)]</i>. A doubled quote
        <code>""</code> without anything in between produces one <code>"</code>.
      </p>
      <h3>Pattern filtering</h3>
      <p>
        Put <code>^</code> and a fixed string right after a fragment to forbid it: if that fragment
        renders exactly that string, the word is discarded. Add several filters by repeating
        <code>^</code>. For example, <code>t[VV]^aa^ii^uu</code> (where V is a subpattern of
        <code>a/i/u</code>) will produce outputs like <i>tai</i>, <i>tua</i>, or <i>tiu</i>, but
        will never produce <i>taa</i>, <i>tii</i>, or <i>tuu</i>.
      </p>
      <p>
        Quotes work inside filters. Other syntax (brackets, slashes, weights, subpattern letters)
        ends the filter, because a filter is a fixed string, not a pattern.
      </p>
      <h3>Colours</h3>
      <p>
        Patterns are colour-coded as you type: subpattern letters, brackets,
        <code>/</code> separators, weights, filters and quoted text each have their own colour. A
        red wavy underline marks a problem, e.g., a capital letter with no subpattern, a bracket
        without its partner, or a weight above 128.
      </p>
      <h3>Generating</h3>
      <p>
        Click Generate to generate the output words. There are a few options you can adjust to
        change the output:
      </p>
      <ul>
        <li><b>Words</b> — how many words to attempt (at most 1,000,000).</li>
        <li><b>New line each</b> — one word per line instead of separated by spaces.</li>
        <li><b>Filter duplicates</b> — each word appears at most once.</li>
      </ul>
      <p>
        Below the output you see how many words were printed, how many were filtered out (by pattern
        filters or as duplicates), the time taken, and the maximum number of different words. That
        last number counts renderings, so it can exceed the number of distinct words, and filters
        are not reflected in it. Up to 1,000,000 words can be generated at once.
      </p>
      <h3>Saving and sharing</h3>
      <p>
        Your settings are remembered in this browser automatically, but there are other ways to save
        or share your settings and output:
      </p>
      <ul>
        <li>
          <b>Save</b> downloads a <code>.awkw</code> file that contains the current settings
          (pattern and subpattern definitions and generation options)
        </li>
        <li>
          <b>Open</b> loads a <code>.awkw</code> file and replaces the current settings with those
          from the file. <code>.awkw</code> files from v1.2 and <code>.awk</code> files from v1.0
          and v1.1 should all load correctly.
        </li>
        <li>
          <b>Share</b> copies a link that contains your patterns. Navigating to that link will open
          this site with the settings loaded.
        </li>
        <li>
          The output panel only displays the first 20,000 results. <b>Copy</b> will copy all results
          (not just those shown) to the clipboard, and <b>Download</b> will download all results to
          a <code>.txt</code> file.
        </li>
        <li><kbd>Ctrl/&#x2318;</kbd> + <kbd>Enter</kbd> triggers the word generation.</li>
      </ul>
      <h3>About Awkwords v{{ VERSION }}</h3>
      <p>Awkwords was created by Petr Mejzlík and ported to Vue 3 and Vite by Ian Cook.</p>
      <p>
        The source code is available
        <a href="https://github.com/nai888/awkwords" target="_blank" rel="noreferrer noopener"
          >on GitHub</a
        >
        along with the
        <a
          href="https://github.com/nai888/awkwords/blob/vue/LICENSE"
          target="_blank"
          rel="noreferrer noopener"
          >license</a
        >
        and
        <a
          href="https://github.com/nai888/awkwords/blob/vue/CHANGELOG.md"
          target="_blank"
          rel="noreferrer noopener"
          >changelog</a
        >.
      </p>
    </article>
  </dialog>
</template>
