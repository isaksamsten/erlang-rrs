%%% @author Isak Karlsson <isak-kar@dsv.su.se>
%%% @copyright (C) 2013, 
%%% @doc
%%%
%%% @end
%%% Created : 23 Jul 2013 by Isak Karlsson <isak-kar@dsv.su.se>
-module(rrs_result_get).

-export([
	 init/3,
	 content_types_provided/2,
	 get/2
	]).

%% @headerfile "rrs.hrl"
-include("rrs.hrl").

init(_Transport, _Req, []) ->
	{upgrade, protocol, cowboy_rest}.

content_types_provided(Req, State) ->
    {[
      {<<"application/json">>, get}
     ], Req, State}.

get(Req, State) ->
    {Id, _} = cowboy_req:binding(id, Req),
    if Id == <<"null">> ->
	    {rrs_json:error("not_found"), Req, State};
       true ->
	    case rrs_database:get_value(list_to_integer(binary_to_list(Id))) of
		not_found ->
		    {rrs_json:error("not_found"), Req, State};
		Data ->
		    JsonData = process_data(Data),
		    {rrs_json:reply(result, JsonData), Req, State}
	    end
    end.

process_data(Data) ->
    #rrs_experiment_data {
       model = Model,
       properties = Props,
       evaluation = Evaluation,
       predictions = Predictions,
       classes = Classes,
       features = Features
      } = Data,
    rrs_json:convert_cv(Evaluation) ++
	Props ++
	[{predictions, rrs_json:convert_predictions(Predictions, Classes)}] ++
	[{features, rrs_json:convert_features(Features)}] ++
	[{model, [{available, Model =/= undefined}]}].
