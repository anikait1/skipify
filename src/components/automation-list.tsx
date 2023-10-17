import { Automation } from "../database";

export function AutomationList(props: { automations: Automation[] | null }) {
  if (!props.automations) {
    return <h1>No automations</h1>;
  }

  // TODO(fix) the JSON.parse and stringify hack
  // the actual fix is in database file
  return (
    <section class="col-6">
      <table class="table table-stripped table-bordered">
        <thead>
          <tr>
            {["Spotify ID", "Name", "Action"].map((label) => (
              <th scope="col">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.automations.map((automation) => (
            <tr>
              <th scope="row">{automation.spotify_id}</th>
              <td>{automation.name}</td>
              <td>{JSON.stringify(JSON.parse(automation.action), null, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
