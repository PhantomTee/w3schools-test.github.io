import json
import genlayer as gl
from genlayer import eq_principle_strict_eq  # noqa: F401

DESIGNER_SYSTEM = """You are a prediction market range designer for tweet engagement metrics on Xen.
Given a tweet's current metric value, metric type, and prediction duration in hours, design 4-6
time-aware ranges that bracket realistic outcomes. The ranges must cover the full outcome space,
start at or above the current value, and be sorted ascending. The last range must be open-ended
(max: null, maxOpen: true). Calibrate difficulty 1-10 based on how far from the current value.

Return STRICT JSON only:
{
  "approved": boolean,
  "marketType": "range_prediction",
  "metricType": string,
  "displayMetric": string,
  "durationHours": number,
  "startValue": number,
  "ranges": [{"min": number, "max": number|null, "maxOpen": boolean, "label": string, "difficulty": number}],
  "riskScore": number,
  "qualityScore": number,
  "reason": string
}"""

GUARD_SYSTEM = """You are a prediction market risk guardian for Xen.
Review the proposed market configuration and ranges for manipulation risk, policy violations,
or unfair range design. Reject if: tweet is older than 3 hours, ranges are absurd, user exceeded
daily limit, tweet has harmful content, or ranges are trivially biased toward one outcome.

Return STRICT JSON only:
{
  "approved": boolean,
  "riskScore": number,
  "rejectionReason": string|null,
  "flags": [string]
}"""

DISPUTE_SYSTEM = """You are a prediction market dispute resolver for Xen.
Given market parameters, the claimed final metric value from the X API, optional snapshots, and
the dispute reason, determine whether the result is valid and what the winning range should be.

Return STRICT JSON only:
{
  "status": "resolved"|"void"|"unresolvable",
  "finalValue": number|null,
  "winningRangeIndex": number|null,
  "confidence": number,
  "reason": string
}"""


class XenMarketAI(gl.Contract):
    def __init__(self) -> None:
        pass

    @gl.public.view
    def design_market(self, input_json: str) -> str:
        data = json.loads(input_json)
        prompt = f"{DESIGNER_SYSTEM}\n\nInput:\n{json.dumps(data, indent=2)}"
        result = gl.nondet.exec_prompt(prompt, response_format="json")
        return json.dumps(result)

    @gl.public.view
    def guard_market(self, input_json: str) -> str:
        data = json.loads(input_json)
        prompt = f"{GUARD_SYSTEM}\n\nInput:\n{json.dumps(data, indent=2)}"
        result = gl.nondet.exec_prompt(prompt, response_format="json")
        return json.dumps(result)

    @gl.public.view
    def resolve_dispute(self, input_json: str) -> str:
        data = json.loads(input_json)
        prompt = f"{DISPUTE_SYSTEM}\n\nInput:\n{json.dumps(data, indent=2)}"
        result = gl.nondet.exec_prompt(prompt, response_format="json")
        return json.dumps(result)
