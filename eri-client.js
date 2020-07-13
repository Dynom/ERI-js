/**
 * ERIClient is just a convenience abstraction against the ERI web service. Typical usage:
 *
 * @example const c = ERIClient.new({url: "..."}); c.suggest("john@example.org", (result) => { ... });
 */
const ERIClient = (function () {
	'use strict';

	const optsAreValid = (opts) => {
		if (!opts) {
			return false;
		}

		// A request with a body which has been read, can't be re-used
		if (opts.request && opts.request.bodyUsed) {
			return false;
		}

		return !(!opts.url || !opts.url.length);
	}

	/**
	 * normalizeURL tidies up the base a bit
	 *
	 * @param base {string}
	 * @param path {string}
	 * @returns {string}
	 */
	const normalizeURL = (base, path) => {
		if (!base.length) {
			base = '';
		}

		if (base.length > 1 && base.slice(-1) === '/') {
			base = base.slice(0, -1);
		}

		return base + path;
	}

	/**
	 * newRequest returns a use-once request object. It either uses a clone of the override or creates a fresh one. The
	 * URL is overridden.
	 *
	 * @param opts {Object}
	 * @returns {Request}
	 */
	const newRequest = (opts) => {
		// Allow passing a custom request object, cloning it so that it can be re-used.
		if (opts.request && opts.request.clone) {
			return opts.request.clone();
		}

		return new Request('',
			{
				method: 'POST',
				headers: new Headers({
					"Content-Type": "application/json"
				}),
				mode: 'cors',
				cache: 'default',
			}
		);
	}

	const newAutocompleteRequest = (opts) => {
		return new Request(normalizeURL(opts.url, '/autocomplete'), newRequest(opts));
	}

	const newSuggestionRequest = (opts) => {
		return new Request(normalizeURL(opts.url, '/suggest'), newRequest(opts));
	}

	/**
	 * doRequest performs the request and provides a minimum guaranteed structure to the callback:
	 * {
	 * 	 ...
	 *   clientError: undefined|string
	 *   ...
	 * }
	 *
	 * @param request {Request}
	 * @param cb {Function}
	 */
	const doRequest = (request, cb) => {
		const skel = {
			clientError: undefined,
			error: undefined
		};

		fetch(request)
		.catch(reason => {
			cb(Object.assign(
				skel,
				{
					clientError: "error in request "+ reason
				}
			));
		})
		.then(r => r.json())
		.then(data => {
			cb(Object.assign(skel, data));
		})
		.catch(reason => {
			throw "error in callback"+ reason;
		});
	};

	const validateCallBack = (cb) => {
		if (typeof cb !== "function") {
			throw "callback to suggest() isn't a function";
		}
	}

	return {

		/**
		 * The factory to create a new ERI client, typical usage:
		 * const c = ERIClient.new({url: "https://wherever.you.host.eri.tld"});
		 *
		 * @throws
		 */
		new: (opts) => {
			if (!optsAreValid(opts)) {
				throw "invalid arguments to ERIClient.new(..)";
			}

			return {
				/**
				 * suggest() provides alternative suggestions for a given input. When the backend is available, it'll
				 * always return an array of alternatives with at least 1 element. The input, or an alternative ERI
				 * classifies as "an alternative worth considering". When multiple elements are returned, they all
				 * have an equal score, which means that they are all considered as equal variant. However the order is
				 * significant based on popularity, index-0 is always the most used candidate.
				 *
				 * c.suggest(event.target.value, function(result) { ... });
				 *
				 * @param email string
				 * @param cb function
				 */
				suggest: (email, cb) => {
					validateCallBack(cb);
					const req = new Request(
						newSuggestionRequest(opts),
						{
							body: JSON.stringify({
								email: email,
							})
						}
					);

					doRequest(req, cb);
				},

				/**
				 * autocomplete() provides previously-considered-good-domain suggestions to complete the input with. On
				 * an empty ERI installation the result will be an empty array. If ERI is configured with a threshold,
				 * domains aren't suggested unless they meet that threshold.
				 *
				 * c.autocomplete(event.target.value, function(result) { ... });
				 *
				 * @param domain string
				 * @param cb function
				 */
				autocomplete: (domain, cb) => {
					validateCallBack(cb);
					const req = new Request(
						newAutocompleteRequest(opts),
						{
							body: JSON.stringify({
								domain: domain,
							})
						}
					);

					doRequest(req, cb);
				}
			};
		}
	};
}());